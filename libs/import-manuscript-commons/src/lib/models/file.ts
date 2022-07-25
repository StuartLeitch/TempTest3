import {
  ValueObjectProps,
  GuardFailure,
  ValueObject,
  Guard, GuardFail,
} from '@hindawi/shared';

import { Path } from './path';

export enum MecaFileType {
  conflictOfInterestStatement = 'ConflictOfInterestStatement',
  supportingInformation = 'SupportingInformation',
  reportsAndResponses = 'ReportsAndResponses',
  supplementary = 'Supplementary',
  coverLetter = 'CoverLetter',
  manuscript = 'Manuscript',
  figure = 'Figure',
  table = 'Table',
  manifestMetadata = 'manifest-metadata',
  transferMetadata = 'transfer-metadata',
  articleMetadata = 'article-metadata',
  reviewMetadata = 'review-metadata',
}

export interface FileProps extends ValueObjectProps {
  name: string;
  size: number;
  type: MecaFileType;
  path: Path;
}

export class File extends ValueObject<FileProps> {
  get name(): string {
    return this.props.name;
  }

  get size(): number {
    return this.props.size;
  }

  get type(): MecaFileType {
    return this.props.type;
  }

  get path(): Path {
    return this.props.path;
  }

  private constructor(props: FileProps) {
    super(props);
  }

  static create(props: FileProps): File {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.path, argumentName: 'path' },
      { argument: props.type, argumentName: 'type' },
    ]);

    if (guardResult.isFail()) {
      throw new GuardFail(guardResult.message);
    } else {
      return new File(props);
    }
  }
}
