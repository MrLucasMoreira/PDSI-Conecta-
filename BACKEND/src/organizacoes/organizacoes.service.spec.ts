import { ForbiddenException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { OrganizacoesService } from './organizacoes.service.js';
import {
  OrganizacaoDocument,
  PapelOrganizacao,
  StatusMembroOrganizacao,
  StatusOrganizacao,
} from './schemas/organizacao.schema.js';
import { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { TipoUsuario } from '../usuarios/schemas/usuario.schema.js';

const admin = new Types.ObjectId().toString();
const usuario = new Types.ObjectId().toString();
const orgId = new Types.ObjectId().toString();
const consulta = (valor: unknown) => ({
  exec: vi.fn().mockResolvedValue(valor),
});

describe('Permissões e solicitações de organizações', () => {
  let service: OrganizacoesService;
  let organizacao: {
    status: StatusOrganizacao;
    membros: {
      usuarioId: Types.ObjectId;
      papel: PapelOrganizacao;
      status: StatusMembroOrganizacao;
    }[];
  };
  let model: {
    findById: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    organizacao = {
      status: StatusOrganizacao.APROVADA,
      membros: [
        {
          usuarioId: new Types.ObjectId(admin),
          papel: PapelOrganizacao.ADMIN,
          status: StatusMembroOrganizacao.APROVADO,
        },
      ],
    };
    model = {
      findById: vi.fn(() => consulta(organizacao)),
      updateOne: vi.fn(() => consulta({ modifiedCount: 1 })),
      create: vi.fn().mockResolvedValue({}),
      find: vi.fn(),
      exists: vi.fn(() => consulta(null)),
    };
    service = new OrganizacoesService(
      model as unknown as Model<OrganizacaoDocument>,
      {
        findById: vi.fn(() => consulta({ ativo: true })),
      } as unknown as Model<UsuarioDocument>,
    );
  });

  it('cria organização pendente com o administrador identificado pela sessão', async () => {
    await service.criar({ nome: 'Organização A' }, admin);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: StatusOrganizacao.PENDENTE,
        criadaPor: new Types.ObjectId(admin),
        membros: [
          expect.objectContaining({
            usuarioId: new Types.ObjectId(admin),
            papel: PapelOrganizacao.ADMIN,
          }),
        ],
      }),
    );
  });

  it('catálogo lista apenas organizações aprovadas sem divulgar membros', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    model.find.mockReturnValue(query);
    await service.listar(TipoUsuario.USUARIO, usuario);
    expect(model.find).toHaveBeenCalledWith({
      status: StatusOrganizacao.APROVADA,
    });
    expect(query.select).toHaveBeenCalledWith(
      'nome descricao status membros',
    );
  });

  it('administrador do sistema lista inclusive organizações pendentes e revogadas', async () => {
    const query = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    model.find.mockReturnValue(query);

    await service.listar(TipoUsuario.ADMIN_SISTEMA, admin);

    expect(model.find).toHaveBeenCalledWith();
    expect(query.populate).toHaveBeenCalledWith(
      'criadaPor',
      'nome email tipo ativo',
    );
  });

  it('recusa nome de organização repetido sem diferenciar maiúsculas', async () => {
    model.exists.mockReturnValue(consulta({ _id: orgId }));

    await expect(
      service.criar({ nome: '  Organização A  ' }, admin),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('registra membro pendente e protege contra duplicação concorrente', async () => {
    const resposta = await service.adicionarMembro(orgId, usuario);
    expect(resposta.membro).toMatchObject({
      papel: PapelOrganizacao.MEMBRO,
      status: StatusMembroOrganizacao.PENDENTE,
    });
    expect(resposta).not.toHaveProperty('membros');
    expect(model.updateOne).toHaveBeenCalledWith(
      {
        _id: orgId,
        status: StatusOrganizacao.APROVADA,
        'membros.usuarioId': { $ne: new Types.ObjectId(usuario) },
      },
      {
        $push: {
          membros: expect.objectContaining({
            usuarioId: new Types.ObjectId(usuario),
            papel: PapelOrganizacao.MEMBRO,
          }),
        },
      },
    );
    model.updateOne.mockReturnValue(consulta({ modifiedCount: 0 }));
    await expect(
      service.adicionarMembro(orgId, usuario),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite solicitar entrada em organizações diferentes', async () => {
    await service.adicionarMembro(orgId, usuario);
    await service.adicionarMembro(new Types.ObjectId().toString(), usuario);
    expect(model.updateOne).toHaveBeenCalledTimes(2);
  });

  it.each(Object.values(StatusMembroOrganizacao))(
    'não repete vínculo com situação %s',
    async (status) => {
      organizacao.membros.push({
        usuarioId: new Types.ObjectId(usuario),
        papel: PapelOrganizacao.MEMBRO,
        status,
      });
      await expect(
        service.adicionarMembro(orgId, usuario),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(model.updateOne).not.toHaveBeenCalled();
    },
  );

  it.each([StatusOrganizacao.PENDENTE, StatusOrganizacao.REVOGADA])(
    'bloqueia solicitação e decisão em organização %s',
    async (status) => {
      organizacao.status = status;
      await expect(
        service.adicionarMembro(orgId, usuario),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.atualizarStatusMembro(
          orgId,
          usuario,
          { status: StatusMembroOrganizacao.APROVADO },
          admin,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(model.updateOne).not.toHaveBeenCalled();
    },
  );

  it('impede que usuário externo consulte membros ou decida solicitações', async () => {
    await expect(service.buscarPorId(orgId, usuario)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.atualizarStatusMembro(
        orgId,
        usuario,
        { status: StatusMembroOrganizacao.APROVADO },
        usuario,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    [PapelOrganizacao.MEMBRO, StatusMembroOrganizacao.APROVADO],
    [PapelOrganizacao.ADMIN, StatusMembroOrganizacao.PENDENTE],
    [PapelOrganizacao.ADMIN, StatusMembroOrganizacao.REJEITADO],
  ])('não autoriza papel %s com status %s', async (papel, status) => {
    organizacao.membros[0].papel = papel;
    organizacao.membros[0].status = status;
    await expect(
      service.atualizarStatusMembro(
        orgId,
        usuario,
        { status: StatusMembroOrganizacao.APROVADO },
        admin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    StatusMembroOrganizacao.APROVADO,
    StatusMembroOrganizacao.REJEITADO,
  ])('administrador decide como %s', async (status) => {
    organizacao.membros.push({
      usuarioId: new Types.ObjectId(usuario),
      papel: PapelOrganizacao.MEMBRO,
      status: StatusMembroOrganizacao.PENDENTE,
    });
    await expect(
      service.atualizarStatusMembro(orgId, usuario, { status }, admin),
    ).resolves.toMatchObject({ usuarioId: usuario, status });
    const [filtro, alteracao, opcoes] = model.updateOne.mock.calls[0];
    expect(filtro.$and).toContainEqual({
      membros: {
        $elemMatch: {
          usuarioId: new Types.ObjectId(admin),
          papel: PapelOrganizacao.ADMIN,
          status: StatusMembroOrganizacao.APROVADO,
        },
      },
    });
    expect(opcoes.arrayFilters[0]['alvo.status']).toBe(
      StatusMembroOrganizacao.PENDENTE,
    );
    expect(alteracao.$set['membros.$[alvo].status']).toBe(status);
  });

  it('não reabre rejeição nem modifica o administrador aprovado', async () => {
    organizacao.membros.push({
      usuarioId: new Types.ObjectId(usuario),
      papel: PapelOrganizacao.MEMBRO,
      status: StatusMembroOrganizacao.REJEITADO,
    });
    await expect(
      service.atualizarStatusMembro(
        orgId,
        usuario,
        { status: StatusMembroOrganizacao.APROVADO },
        admin,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.atualizarStatusMembro(
        orgId,
        admin,
        { status: StatusMembroOrganizacao.REJEITADO },
        admin,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('detecta decisão concorrente ou perda de permissão', async () => {
    organizacao.membros.push({
      usuarioId: new Types.ObjectId(usuario),
      papel: PapelOrganizacao.MEMBRO,
      status: StatusMembroOrganizacao.PENDENTE,
    });
    model.updateOne.mockReturnValue(consulta({ modifiedCount: 0 }));
    await expect(
      service.atualizarStatusMembro(
        orgId,
        usuario,
        { status: StatusMembroOrganizacao.APROVADO },
        admin,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
