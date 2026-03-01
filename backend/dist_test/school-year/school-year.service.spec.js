"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const school_year_service_1 = require("./school-year.service");
describe('SchoolYearService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [school_year_service_1.SchoolYearService],
        }).compile();
        service = module.get(school_year_service_1.SchoolYearService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
