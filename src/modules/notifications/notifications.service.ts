import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../common/entities';
import { NotificationType, NotificationStatus } from '../../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async createNotification(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    related_id?: string;
    related_type?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      related_id: data.related_id,
      related_type: data.related_type,
      metadata: data.metadata,
      status: NotificationStatus.UNREAD,
    });

    return this.notificationsRepository.save(notification);
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { data: notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { user_id: userId, status: NotificationStatus.UNREAD },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.read_at = new Date();
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user_id: userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, read_at: new Date() },
    );
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationsRepository.remove(notification);
  }

  async deleteUserNotifications(userId: string): Promise<void> {
    await this.notificationsRepository.delete({ user_id: userId });
  }

  async archiveNotification(notificationId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.ARCHIVED;
    return this.notificationsRepository.save(notification);
  }
}
