"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const school_year_controller_1 = require("./school-year.controller");
describe('SchoolYearController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [school_year_controller_1.SchoolYearController],
        }).compile();
        controller = module.get(school_year_controller_1.SchoolYearController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
