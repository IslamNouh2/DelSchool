"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transition_controller_1 = require("./transition.controller");
describe('TransitionController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [transition_controller_1.TransitionController],
        }).compile();
        controller = module.get(transition_controller_1.TransitionController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
