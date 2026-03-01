"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transition_service_1 = require("./transition.service");
describe('TransitionService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [transition_service_1.TransitionService],
        }).compile();
        service = module.get(transition_service_1.TransitionService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
