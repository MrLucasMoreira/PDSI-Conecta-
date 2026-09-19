import { Test, TestingModule } from '@nestjs/testing';
import { ComissoesController } from './comissoes.controller.js';
import { ComissoesService } from './comissoes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('ComissoesController', () => {
  let controller: ComissoesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComissoesController],
      providers: [{ provide: ComissoesService, useValue: {} }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();

    controller = module.get<ComissoesController>(ComissoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
