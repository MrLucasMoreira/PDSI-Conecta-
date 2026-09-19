import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Organizacao,
  OrganizacaoDocument,
  PapelOrganizacao,
  StatusMembroOrganizacao,
  StatusOrganizacao,
} from './schemas/organizacao.schema.js';

import {
  TipoUsuario,
  Usuario,
  UsuarioDocument,
} from '../usuarios/schemas/usuario.schema.js';

import { CreateOrganizacaoDto } from './dto/create-organizacao.dto.js';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto.js';
import { UpdateStatusMembroDto } from './dto/update-status-membro.dto.js';

@Injectable()
export class OrganizacoesService {
  constructor(
    @InjectModel(Organizacao.name)
    private readonly organizacaoModel: Model<OrganizacaoDocument>,

    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async criar(createOrganizacaoDto: CreateOrganizacaoDto, usuarioId: string) {
    const usuario = await this.usuarioModel.findById(usuarioId).exec();

    if (!usuario) {
      throw new NotFoundException('Usuário criador não encontrado');
    }

    const nome = createOrganizacaoDto.nome.trim();
    await this.exigirNomeDisponivel(nome);

    const organizacao = await this.organizacaoModel.create({
      nome,
      descricao: createOrganizacaoDto.descricao?.trim() || undefined,
      criadaPor: new Types.ObjectId(usuarioId),
      status: StatusOrganizacao.PENDENTE,

      membros: [
        {
          usuarioId: new Types.ObjectId(usuarioId),
          papel: PapelOrganizacao.ADMIN,
          status: StatusMembroOrganizacao.APROVADO,
          solicitadoEm: new Date(),
          aprovadoEm: new Date(),
        },
      ],
    });

    return organizacao;
  }

  async listar(tipoUsuario: TipoUsuario, usuarioId: string) {
    if (tipoUsuario === TipoUsuario.ADMIN_SISTEMA) {
      return this.organizacaoModel
        .find()
        .populate('criadaPor', 'nome email tipo ativo')
        .sort({ criadoEm: -1 })
        .exec();
    }

    const organizacoes = await this.organizacaoModel
      .find({ status: StatusOrganizacao.APROVADA })
      .select('nome descricao status membros')
      .sort({ criadoEm: -1 })
      .lean()
      .exec();

    return organizacoes.map((organizacao) => {
      const meuVinculo = organizacao.membros.find(
        (membro) => membro.usuarioId.toString() === usuarioId,
      );

      return {
        _id: organizacao._id,
        nome: organizacao.nome,
        descricao: organizacao.descricao,
        status: organizacao.status,
        meuVinculo: meuVinculo
          ? { papel: meuVinculo.papel, status: meuVinculo.status }
          : null,
      };
    });
  }

  async buscarPorId(id: string, solicitanteId: string) {
    await this.exigirAdministrador(id, solicitanteId);
    return this.detalhes(id);
  }

  private async detalhes(id: string) {
    this.validarId(id);

    const organizacao = await this.organizacaoModel
      .findById(id)
      .populate('criadaPor', 'nome email tipo ativo')
      .populate('membros.usuarioId', 'nome email tipo ativo')
      .exec();

    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada');
    }

    return organizacao;
  }

  async atualizar(id: string, updateOrganizacaoDto: UpdateOrganizacaoDto) {
    this.validarId(id);

    const dados = { ...updateOrganizacaoDto };

    if (dados.nome !== undefined) {
      dados.nome = dados.nome.trim();
      await this.exigirNomeDisponivel(dados.nome, id);
    }

    if (dados.descricao !== undefined) {
      dados.descricao = dados.descricao.trim();
    }

    const organizacao = await this.organizacaoModel
      .findByIdAndUpdate(id, dados, { new: true, runValidators: true })
      .populate('criadaPor', 'nome email tipo ativo')
      .populate('membros.usuarioId', 'nome email tipo ativo')
      .exec();

    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada');
    }

    return organizacao;
  }

  async remover(id: string) {
    this.validarId(id);

    const organizacao = await this.organizacaoModel
      .findByIdAndUpdate(
        id,
        {
          status: StatusOrganizacao.REVOGADA,
        },
        {
          new: true,
        },
      )
      .exec();

    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada');
    }

    return {
      mensagem: 'Organização revogada com sucesso',
      organizacao,
    };
  }

  async adicionarMembro(id: string, usuarioId: string) {
    this.validarId(id);
    this.validarId(usuarioId);

    const organizacao = await this.organizacaoModel.findById(id).exec();

    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada');
    }

    this.exigirOrganizacaoAprovada(organizacao);

    const usuario = await this.usuarioModel.findById(usuarioId).exec();

    if (!usuario || !usuario.ativo) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const jaExiste = organizacao.membros.some(
      (membro) => membro.usuarioId.toString() === usuarioId,
    );

    if (jaExiste) {
      throw new ConflictException(
        'Usuário já pertence ou possui solicitação nesta organização',
      );
    }

    const membro = {
      usuarioId: new Types.ObjectId(usuarioId),
      papel: PapelOrganizacao.MEMBRO,
      status: StatusMembroOrganizacao.PENDENTE,
      solicitadoEm: new Date(),
    };
    // O filtro evita duplicação mesmo quando duas solicitações chegam juntas.
    const resultado = await this.organizacaoModel
      .updateOne(
        {
          _id: id,
          status: StatusOrganizacao.APROVADA,
          'membros.usuarioId': { $ne: membro.usuarioId },
        },
        { $push: { membros: membro } },
      )
      .exec();
    if (resultado.modifiedCount !== 1) {
      throw new ConflictException(
        'Solicitação já registrada ou organização indisponível',
      );
    }
    return { mensagem: 'Solicitação enviada para análise', membro };
  }

  async atualizarStatusMembro(
    id: string,
    usuarioId: string,
    updateStatusDto: UpdateStatusMembroDto,
    solicitanteId: string,
  ) {
    this.validarId(id);
    this.validarId(usuarioId);

    const organizacao = await this.exigirAdministrador(id, solicitanteId);
    this.exigirOrganizacaoAprovada(organizacao);
    if (
      ![
        StatusMembroOrganizacao.APROVADO,
        StatusMembroOrganizacao.REJEITADO,
      ].includes(updateStatusDto.status)
    ) {
      throw new BadRequestException(
        'Escolha aprovar ou rejeitar a solicitação',
      );
    }

    const membro = organizacao.membros.find(
      (item) => item.usuarioId.toString() === usuarioId,
    );

    if (!membro) {
      throw new NotFoundException('Membro não encontrado nesta organização');
    }

    if (membro.status !== StatusMembroOrganizacao.PENDENTE) {
      throw new ConflictException(
        'Apenas solicitações pendentes podem ser analisadas',
      );
    }

    const resultado = await this.organizacaoModel
      .updateOne(
        {
          _id: id,
          status: StatusOrganizacao.APROVADA,
          $and: [
            {
              membros: {
                $elemMatch: {
                  usuarioId: new Types.ObjectId(solicitanteId),
                  papel: PapelOrganizacao.ADMIN,
                  status: StatusMembroOrganizacao.APROVADO,
                },
              },
            },
            {
              membros: {
                $elemMatch: {
                  usuarioId: new Types.ObjectId(usuarioId),
                  status: StatusMembroOrganizacao.PENDENTE,
                },
              },
            },
          ],
        },
        updateStatusDto.status === StatusMembroOrganizacao.APROVADO
          ? {
              $set: {
                'membros.$[alvo].status': updateStatusDto.status,
                'membros.$[alvo].aprovadoEm': new Date(),
              },
            }
          : {
              $set: { 'membros.$[alvo].status': updateStatusDto.status },
              $unset: { 'membros.$[alvo].aprovadoEm': '' },
            },
        {
          arrayFilters: [
            {
              'alvo.usuarioId': new Types.ObjectId(usuarioId),
              'alvo.status': StatusMembroOrganizacao.PENDENTE,
            },
          ],
        },
      )
      .exec();
    if (resultado.modifiedCount !== 1) {
      throw new ConflictException(
        'A solicitação ou as permissões foram alteradas. Atualize a lista',
      );
    }
    return {
      mensagem: 'Solicitação analisada',
      usuarioId,
      status: updateStatusDto.status,
    };
  }

  private async exigirAdministrador(id: string, usuarioId: string) {
    this.validarId(id);
    this.validarId(usuarioId);
    const organizacao = await this.organizacaoModel.findById(id).exec();
    if (!organizacao) throw new NotFoundException('Organização não encontrada');
    const administrador = organizacao.membros.some(
      (membro) =>
        membro.usuarioId.toString() === usuarioId &&
        membro.papel === PapelOrganizacao.ADMIN &&
        membro.status === StatusMembroOrganizacao.APROVADO,
    );
    if (!administrador)
      throw new ForbiddenException(
        'Apenas administradores desta organização podem realizar esta operação',
      );
    return organizacao;
  }

  private exigirOrganizacaoAprovada(organizacao: Organizacao) {
    if (organizacao.status !== StatusOrganizacao.APROVADA) {
      throw new ForbiddenException(
        'A organização não está aprovada para receber ou analisar solicitações',
      );
    }
  }

  private async exigirNomeDisponivel(nome: string, ignorarId?: string) {
    const nomeExato = new RegExp(
      `^${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    const filtro: Record<string, unknown> = { nome: nomeExato };

    if (ignorarId) {
      filtro._id = { $ne: new Types.ObjectId(ignorarId) };
    }

    const existente = await this.organizacaoModel.exists(filtro).exec();

    if (existente) {
      throw new ConflictException('Já existe uma organização com este nome');
    }
  }

  private validarId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }
  }
}
