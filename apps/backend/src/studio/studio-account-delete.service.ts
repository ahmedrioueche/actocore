import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectDeleteService } from '../projects/project-delete.service';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from './schemas/studio-membership.schema';
import { StudioUser, StudioUserDocument } from './schemas/studio-user.schema';

@Injectable()
export class StudioAccountDeleteService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(StudioUser.name)
    private readonly userModel: Model<StudioUserDocument>,
    private readonly projectDelete: ProjectDeleteService,
  ) {}

  async deleteEntireAccount(accountId: string): Promise<void> {
    const projects = await this.projectModel
      .find({ accountId })
      .select('_id')
      .exec();
    for (const project of projects) {
      await this.projectDelete.deleteProject(
        project._id.toString(),
        accountId,
      );
    }

    await this.membershipModel.deleteMany({
      accountId: new Types.ObjectId(accountId),
    });
    await this.accountModel.findByIdAndDelete(accountId);
  }

  async removeEditorMembership(
    userId: string,
    accountId: string,
  ): Promise<void> {
    await this.membershipModel.deleteOne({
      userId: new Types.ObjectId(userId),
      accountId: new Types.ObjectId(accountId),
    });
    await this.userModel.findByIdAndDelete(userId);
  }

  async countAccountMembers(accountId: string): Promise<number> {
    return this.membershipModel.countDocuments({
      accountId: new Types.ObjectId(accountId),
    });
  }
}
