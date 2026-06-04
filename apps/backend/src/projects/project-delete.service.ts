import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiKey, ApiKeyDocument } from '../auth/schemas/api-key.schema';
import {
  ProjectAction,
  ProjectActionDocument,
} from '../actions/schemas/project-action.schema';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from '../knowledge/schemas/knowledge-source.schema';
import { KnowledgeStorageService } from '../knowledge/knowledge-storage.service';
import {
  ChatMessage,
  ChatMessageDocument,
} from '../sessions/schemas/chat-message.schema';
import {
  ChatSession,
  ChatSessionDocument,
} from '../sessions/schemas/chat-session.schema';
import { UsageEvent, UsageEventDocument } from '../usage/schemas/usage-event.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from '../studio/schemas/studio-membership.schema';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectDeleteService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(ProjectAction.name)
    private readonly actionModel: Model<ProjectActionDocument>,
    @InjectModel(KnowledgeSource.name)
    private readonly knowledgeSourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly knowledgeChunkModel: Model<KnowledgeChunkDocument>,
    @InjectModel(ChatSession.name)
    private readonly sessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
    @InjectModel(UsageEvent.name)
    private readonly usageModel: Model<UsageEventDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly knowledgeStorage: KnowledgeStorageService,
  ) {}

  /** Deletes a project and all tenant data scoped to it. */
  async deleteProject(projectId: string, accountId: string): Promise<void> {
    const sources = await this.knowledgeSourceModel.find({ projectId }).exec();
    await Promise.all(
      sources.map((s) => this.knowledgeStorage.remove(s.storageKey)),
    );

    await Promise.all([
      this.apiKeyModel.deleteMany({ projectId }),
      this.actionModel.deleteMany({ projectId }),
      this.knowledgeChunkModel.deleteMany({ projectId }),
      this.knowledgeSourceModel.deleteMany({ projectId }),
      this.messageModel.deleteMany({ projectId }),
      this.sessionModel.deleteMany({ projectId }),
      this.usageModel.deleteMany({ projectId }),
    ]);

    await this.membershipModel.updateMany(
      { accountId: new Types.ObjectId(accountId) },
      { $pull: { projectIds: projectId } },
    );

    await this.projectModel.findByIdAndDelete(projectId);
  }
}
