"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterModule = void 0;
const common_1 = require("@nestjs/common");
const parameter_service_1 = require("./parameter.service");
const parameter_controller_1 = require("./parameter.controller");
let ParameterModule = class ParameterModule {
};
exports.ParameterModule = ParameterModule;
exports.ParameterModule = ParameterModule = __decorate([
    (0, common_1.Module)({
        controllers: [parameter_controller_1.ParameterController],
        providers: [parameter_service_1.ParameterService],
        exports: [parameter_service_1.ParameterService],
    })
], ParameterModule);
