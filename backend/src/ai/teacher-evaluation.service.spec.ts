/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TeacherEvaluationService } from './teacher-evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('TeacherEvaluationService', () => {
  let service: TeacherEvaluationService;
  let prisma: PrismaService;

  const mockTeacher = {
    employerId: 1,
    tenantId: 'tenant-1',
    weeklyWorkload: 25,
    Teachersubjects: [],
    TeacherCalsses: {
      Class: {
        studentClasses: []
      }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherEvaluationService,
        {
          provide: PrismaService,
          useValue: {
            employer: {
              findUnique: jest.fn(),
            },
            teacherEvaluation: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TeacherEvaluationService>(TeacherEvaluationService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Mock global fetch
    globalThis.fetch = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateTeacher', () => {
    it('should throw NotFoundException if teacher does not exist', async () => {
      jest.spyOn(prisma.employer, 'findUnique').mockResolvedValue(null);
      await expect(service.evaluateTeacher(99)).rejects.toThrow(NotFoundException);
    });

    it('should return evaluation results when AI service responds', async () => {
      jest.spyOn(prisma.employer, 'findUnique').mockResolvedValue(mockTeacher as any);
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          score: 85,
          improvementProbability: 0.7,
          weakAreas: ['None'],
          trainingPlan: ['Advanced Course'],
        }),
      });

      jest.spyOn(prisma.teacherEvaluation, 'create').mockResolvedValue({
        id: 1,
        teacherId: 1,
        score: 85,
        improvementProbability: 0.7,
        weakAreas: ['None'],
        trainingPlan: ['Advanced Course'],
        createdAt: new Date(),
        tenantId: 'tenant-1',
      } as any);

      const result = await service.evaluateTeacher(1);
      expect(result.score).toBe(85);
      expect(prisma.teacherEvaluation.create).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if AI service fails', async () => {
      jest.spyOn(prisma.employer, 'findUnique').mockResolvedValue(mockTeacher as any);
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Error',
      });

      await expect(service.evaluateTeacher(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
