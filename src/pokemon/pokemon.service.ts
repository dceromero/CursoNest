import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { log } from 'console';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) {

  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto)
      return pokemon;
    } catch (error) {
      this.errorHandled(error);
    }

  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(term: string) {
    let pokemon: Pokemon
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    } else if (isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    } else {
      pokemon = await this.pokemonModel.findOne({ name: term });
    }
    if (pokemon == null) {
      throw new NotFoundException(`No existe el Pokemon con el Id, No o Nombre ${term}`)
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try {
      const pokemon = await this.findOne(term);
      if (updatePokemonDto.name) {
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      }
      await pokemon.updateOne(updatePokemonDto, { new: true });
      return { ...pokemon.toJSON(), ...updatePokemonDto };

    } catch (error) {
      this.errorHandled(error);
    }
  }

  async remove(term: string) {
    const pokemon = await this.findOne(term);
    await pokemon.deleteOne();
  }

  async deletefindByAndDelete(id: string) {
    return await this.pokemonModel.findByIdAndDelete(id);
  }

  async delete(id: string) {
    const elimado = await this.pokemonModel.deleteOne({ _id: id });
    if (elimado.deletedCount==0){
      throw new BadRequestException(`El Registro con este id ${id} no existe`);
    }
    return elimado;
  }

  private errorHandled(error: any) {
    if (error.code == 11000) {
      let mensaje = `con el No ${error.keyValue.no}`;
      if (isNaN(+error.keyValue.no)) {
        mensaje = `con el Name: ${error.keyValue.name}`;
      }
      throw new BadRequestException(`El pokemon ya existe ${mensaje}`);
    }
    log(error);
    throw new InternalServerErrorException(`Error el servidor revisar el Log`);
  }
}
