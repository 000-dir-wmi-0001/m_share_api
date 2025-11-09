import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectFile, FileVersion } from '../../common/entities';
import { ProjectFilesService } from './project-files.service';

describe('ProjectFilesService', () => {
  let service: ProjectFilesService;

  const mockFile = {
    id: 'file-1',
    project_id: 'project-1',
    uploaded_by_id: 'user-1',
    name: 'design.figma',
    description: 'Main design file',
    folder: 'designs',
    url: 'https://storage.example.com/files/file-1.figma',
    size: 2048576,
    mime_type: 'application/x-figma',
    file_extension: 'figma',
    version_number: 1,
    is_latest_version: true,
    download_count: 5,
    created_at: new Date('2025-11-09T11:00:00Z'),
    updated_at: new Date('2025-11-09T11:00:00Z'),
    metadata: null,
  };

  const mockVersion = {
    id: 'version-1',
    file_id: 'file-1',
    uploaded_by_id: 'user-1',
    version_number: 1,
    size: 2048576,
    url: 'https://storage.example.com/files/file-1.figma',
    change_note: 'Initial upload',
    created_at: new Date('2025-11-09T11:00:00Z'),
    metadata: null,
  };

  const mockFileRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVersionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectFilesService,
        {
          provide: getRepositoryToken(ProjectFile),
          useValue: mockFileRepository,
        },
        {
          provide: getRepositoryToken(FileVersion),
          useValue: mockVersionRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectFilesService>(ProjectFilesService);
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file and create initial version', async () => {
      mockFileRepository.save.mockResolvedValue(mockFile);
      mockVersionRepository.save.mockResolvedValue(mockVersion);

      const result = await service.uploadFile(
        'project-1',
        'user-1',
        'design.figma',
        2048576,
        'application/x-figma',
        'https://storage.example.com/files/file-1.figma',
        'designs',
        'Main design file',
      );

      expect(result).toEqual(mockFile);
      expect(mockFileRepository.save).toHaveBeenCalled();
      expect(mockVersionRepository.save).toHaveBeenCalled();
    });
  });

  describe('getProjectFiles', () => {
    it('should return files with pagination', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockFile], 1]),
      };
      mockFileRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getProjectFiles('project-1', 20, 0);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by folder if provided', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockFile], 1]),
      };
      mockFileRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.getProjectFiles('project-1', 20, 0, 'designs');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'file.folder = :folder',
        { folder: 'designs' },
      );
    });
  });

  describe('getFileById', () => {
    it('should return file by id', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      const result = await service.getFileById('project-1', 'file-1');

      expect(result).toEqual(mockFile);
      expect(mockFileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'file-1', project_id: 'project-1' },
      });
    });

    it('should throw NotFoundException if file not found', async () => {
      mockFileRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileById('project-1', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateFileMetadata', () => {
    it('should update file metadata', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      const updatedFile = { ...mockFile, name: 'updated_design.figma' };
      mockFileRepository.save.mockResolvedValue(updatedFile);

      const result = await service.updateFileMetadata('project-1', 'file-1', 'user-1', {
        name: 'updated_design.figma',
      });

      expect(result.name).toBe('updated_design.figma');
    });

    it('should throw ForbiddenException if user is not file uploader', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      await expect(
        service.updateFileMetadata('project-1', 'file-1', 'user-2', { name: 'new_name.figma' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      mockFileRepository.remove.mockResolvedValue(undefined);

      await service.deleteFile('project-1', 'file-1', 'user-1');

      expect(mockFileRepository.remove).toHaveBeenCalledWith(mockFile);
    });

    it('should throw ForbiddenException if user is not file uploader', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      await expect(service.deleteFile('project-1', 'file-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('incrementDownloadCount', () => {
    it('should increment download count', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      mockFileRepository.save.mockResolvedValue({ ...mockFile, download_count: 6 });

      await service.incrementDownloadCount('project-1', 'file-1');

      expect(mockFileRepository.save).toHaveBeenCalled();
    });
  });

  describe('getFileVersions', () => {
    it('should return file versions', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      mockVersionRepository.find.mockResolvedValue([mockVersion]);

      const result = await service.getFileVersions('project-1', 'file-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockVersion);
    });
  });

  describe('restoreFileVersion', () => {
    it('should restore file version', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      mockVersionRepository.findOne.mockResolvedValue(mockVersion);
      const restoredFile = { ...mockFile, version_number: 2 };
      mockFileRepository.save.mockResolvedValue(restoredFile);
      mockVersionRepository.save.mockResolvedValue({
        ...mockVersion,
        version_number: 2,
        change_note: 'Restored from version 1',
      });

      const result = await service.restoreFileVersion('project-1', 'file-1', 'version-1', 'user-1');

      expect(result.version_number).toBe(2);
      expect(mockFileRepository.save).toHaveBeenCalled();
      expect(mockVersionRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not file uploader', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      await expect(
        service.restoreFileVersion('project-1', 'file-1', 'version-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if version not found', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      mockVersionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.restoreFileVersion('project-1', 'file-1', 'nonexistent-version', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadNewFileVersion', () => {
    it('should upload new file version', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      const newVersionFile = { ...mockFile, version_number: 2 };
      mockFileRepository.save.mockResolvedValue(newVersionFile);
      mockVersionRepository.save.mockResolvedValue({
        ...mockVersion,
        version_number: 2,
        change_note: 'Updated colors',
      });

      const result = await service.uploadNewFileVersion(
        'project-1',
        'file-1',
        'user-1',
        2100000,
        'application/x-figma',
        'https://storage.example.com/files/file-1-v2.figma',
        'Updated colors',
      );

      expect(result.version_number).toBe(2);
      expect(mockFileRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not file uploader', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      await expect(
        service.uploadNewFileVersion(
          'project-1',
          'file-1',
          'user-2',
          2100000,
          'application/x-figma',
          'https://storage.example.com/files/file-1-v2.figma',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
