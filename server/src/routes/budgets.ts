import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all budgets for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const budgets = await prisma.budget.findMany({
      where: { userId },
    });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create a new budget
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { category, amount, period } = req.body;
    
    const budget = await prisma.budget.create({
      data: {
        category,
        amount: parseFloat(amount),
        spent: 0,
        period,
        userId,
      },
    });
    
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update a budget
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { amount, spent, period } = req.body;
    
    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (budget.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (spent !== undefined) updateData.spent = parseFloat(spent);
    if (period !== undefined) updateData.period = period;
    
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
    });
    
    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete a budget
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (budget.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.budget.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router; 