import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Repository } from 'typeorm';
import { Badge } from '../badges/entities/badge.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,

    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) { }

  async create(createCardDto: CreateCardDto) {
    return await this.cardRepository.save(createCardDto);
  }

  async findAll(kanban_id: string) {
    const cards = await this.cardRepository
      .createQueryBuilder('cards')
      .leftJoinAndSelect('cards.badges', 'badges')
      .where('cards.kanban_id = :kanban_id', { kanban_id })
      .orderBy('cards.order', 'ASC')
      .getMany();
    return cards;
  }

  async findOne(id: string) {
    const card = await this.cardRepository.findOne({ where: { id: id }, relations: ["badges"] })
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card;
  }

  async update(id: string, updateCardDto: Partial<Card>) {
    await this.cardRepository.update(id, updateCardDto);
    return await this.findOne(id)
  }

  async remove(id: string) {
    const card: Card = await this.findOne(id);
    await this.cardRepository.delete(id);
    return card
  }
  
  async linkBadgeToCard(card_id: string, badge_id: string) {
    const card = await this.cardRepository.findOne({ where: { id: card_id }, relations: ['badges'] });
    const badge = await this.badgeRepository.findOne({ where: {id: badge_id }});
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }
    card.badges.push(badge);
    return await this.cardRepository.save(card)
  }

  async unlinkBadgeToCard(card_id: string, badge_id: string) {
    const card = await this.cardRepository.findOne({ where: { id: card_id }, relations: ['badges'] });
    card.badges = card.badges.filter((badge) => badge.id !== badge_id)
    return await this.cardRepository.save(card)
  }
}
