import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel:Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      //insertar en base de datos
      const pokemon = await this.pokemonModel.create(createPokemonDto);
  
      return pokemon;
      
    } catch (error) {
      this.handleExeptions(error);
    }

  }

  async findAll() {

    const pokemons = await this.pokemonModel.find();
    return pokemons;
  }

   async findOne(term: string) {
    let pokemon : Pokemon;
    if(!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({no:term});
    }


    //verificar si es in id de Mongo y busqued por id
    if(!pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }

    //buscar por nombre
    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name:term.toLowerCase().trim()});
    }

    //si no se encuentra nada
    if(!pokemon) throw new NotFoundException(`The pokemon with no or name : ${term} not found`)

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(term);
      if(updatePokemonDto.name){
        updatePokemonDto.name=updatePokemonDto.name.toLowerCase();
      }
      
      try {
        await pokemon.updateOne(updatePokemonDto,{new:true});
        return {...pokemon.toJSON(), ...updatePokemonDto};
      } catch (error) {
        this.handleExeptions(error);
      }

  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    const {deletedCount} = await this.pokemonModel.deleteOne({_id:id});
    if(deletedCount === 0){
      throw new BadRequestException(`Pokemon with id: ${id} not found`)
    }
    return;
  }

  private handleExeptions(error:any){
    if(error.code === 11000){
      throw new BadRequestException(`This pokemon exist in DB ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error.keyValue);
    throw new InternalServerErrorException(`Can't updated pokemon check logs`);
  }

}
