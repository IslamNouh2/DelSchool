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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Req, UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    create(@Req() req: any, @Body() createEventDto: CreateEventDto) {
        return this.eventService.create(req.tenantId, createEventDto);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.eventService.findAll(req.tenantId, req.user?.role);
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.eventService.findOne(req.tenantId, id);
    }

    @Put(':id')
    update(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: UpdateEventDto,
    ) {
        return this.eventService.update(req.tenantId, id, updateEventDto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.eventService.remove(req.tenantId, id);
    }
}
