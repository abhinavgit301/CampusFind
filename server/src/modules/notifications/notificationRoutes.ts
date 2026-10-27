import { Router, Request, Response } from 'express';
import { Notification } from '../../models/Notification.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me/notifications', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate('relatedReportId', 'publicId title'),
      Notification.countDocuments({ recipientId: req.user.id, readAt: null }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

router.post('/me/notifications/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ message: 'Marked as read', notification });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

router.post('/me/notifications/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await Notification.updateMany(
      { recipientId: req.user.id, readAt: null },
      { readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notifications.' });
  }
});

export const notificationRoutes = router;
