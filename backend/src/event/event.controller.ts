import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/CreateEventDto';
import { UpdateEventDto } from './dto/UpdateEventDto';

@Controller('event')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    create(@Body() createEventDto: CreateEventDto) {
        return this.eventService.create(createEventDto);
    }

    @Get()
    findAll() {
        return this.eventService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: UpdateEventDto,
    ) {
        return this.eventService.update(id, updateEventDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.eventService.remove(id);
    }
}
