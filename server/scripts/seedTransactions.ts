import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

// Categories for expenses
const expenseCategories = [
  'Groceries',
  'Dining',
  'Entertainment',
  'Shopping',
  'Transportation',
  'Utilities',
  'Housing',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts',
  'Subscriptions',
  'Miscellaneous'
];

// Categories for income
const incomeCategories = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Refunds',
  'Other'
];

// Define transaction interface
interface Transaction {
  amount: number;
  type: string;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

// Descriptions for expenses by category
const expenseDescriptions: Record<string, string[]> = {
  Groceries: [
    'Whole Foods Market',
    'Trader Joe\'s',
    'Safeway',
    'Costco',
    'Target Groceries',
    'Walmart Grocery',
    'Local Farmers Market',
    'Sprouts',
    'Kroger',
    'Albertsons'
  ],
  Dining: [
    'Starbucks',
    'Chipotle',
    'The Cheesecake Factory',
    'Olive Garden',
    'Local Coffee Shop',
    'Sushi Restaurant',
    'Pizza Delivery',
    'Thai Restaurant',
    'Fast Food',
    'Brunch with Friends'
  ],
  Entertainment: [
    'Movie Tickets',
    'Netflix Subscription',
    'Spotify Premium',
    'Concert Tickets',
    'Theater Show',
    'Disney+ Subscription',
    'Apple TV+',
    'HBO Max',
    'Video Game Purchase',
    'Bowling Night'
  ],
  Shopping: [
    'Amazon Purchase',
    'Target',
    'Walmart',
    'Best Buy',
    'Apple Store',
    'Clothing Store',
    'Home Goods',
    'Bookstore',
    'Online Shopping',
    'Department Store'
  ],
  Transportation: [
    'Uber Ride',
    'Lyft Ride',
    'Gas Station',
    'Public Transit',
    'Parking Fee',
    'Car Maintenance',
    'Toll Payment',
    'Rental Car',
    'Bike Share',
    'Scooter Rental'
  ],
  Utilities: [
    'Electricity Bill',
    'Water Bill',
    'Internet Service',
    'Cell Phone Bill',
    'Gas Bill',
    'Trash Service',
    'Cable TV',
    'Home Phone',
    'Security System',
    'VPN Service'
  ],
  Housing: [
    'Rent Payment',
    'Mortgage Payment',
    'Home Insurance',
    'Property Tax',
    'HOA Fees',
    'Home Repairs',
    'Furniture Purchase',
    'Home Decor',
    'Cleaning Service',
    'Lawn Care'
  ],
  Healthcare: [
    'Doctor Visit',
    'Prescription',
    'Dental Checkup',
    'Vision Care',
    'Health Insurance',
    'Gym Membership',
    'Therapy Session',
    'Vitamins & Supplements',
    'Urgent Care',
    'Medical Equipment'
  ],
  Travel: [
    'Flight Tickets',
    'Hotel Stay',
    'Airbnb',
    'Travel Insurance',
    'Vacation Package',
    'Cruise Booking',
    'Car Rental',
    'Travel Gear',
    'Tours & Activities',
    'Souvenirs'
  ],
  Education: [
    'Tuition Payment',
    'Textbooks',
    'Online Course',
    'School Supplies',
    'Tutoring',
    'Workshop Fee',
    'Professional Certification',
    'Language Learning App',
    'Educational Software',
    'Student Loan Payment'
  ],
  'Personal Care': [
    'Haircut',
    'Spa Treatment',
    'Skincare Products',
    'Makeup',
    'Nail Salon',
    'Barber Shop',
    'Personal Trainer',
    'Massage Therapy',
    'Grooming Products',
    'Fitness Equipment'
  ],
  Gifts: [
    'Birthday Present',
    'Holiday Gift',
    'Wedding Gift',
    'Anniversary Present',
    'Baby Shower Gift',
    'Graduation Present',
    'Housewarming Gift',
    'Thank You Gift',
    'Charity Donation',
    'Gift Card Purchase'
  ],
  Subscriptions: [
    'Amazon Prime',
    'Gym Membership',
    'Cloud Storage',
    'News Subscription',
    'Magazine Subscription',
    'Software License',
    'Meal Kit Service',
    'Music Streaming',
    'Video Streaming',
    'Productivity Apps'
  ],
  Miscellaneous: [
    'ATM Withdrawal',
    'Bank Fee',
    'Late Payment Fee',
    'Membership Renewal',
    'Postage & Shipping',
    'Office Supplies',
    'Pet Supplies',
    'Lottery Ticket',
    'Vending Machine',
    'Unexpected Expense'
  ]
};

// Descriptions for income by category
const incomeDescriptions: Record<string, string[]> = {
  Salary: [
    'Monthly Salary',
    'Bi-weekly Paycheck',
    'Bonus Payment',
    'Commission',
    'Overtime Pay'
  ],
  Freelance: [
    'Freelance Project',
    'Consulting Fee',
    'Contract Work',
    'Gig Economy Earnings',
    'Side Hustle Income'
  ],
  Investments: [
    'Stock Dividend',
    'Interest Income',
    'Capital Gains',
    'Rental Income',
    'Investment Return'
  ],
  Gifts: [
    'Birthday Gift',
    'Holiday Gift',
    'Wedding Gift',
    'Graduation Gift',
    'Cash Gift'
  ],
  Refunds: [
    'Tax Refund',
    'Product Return',
    'Service Refund',
    'Insurance Reimbursement',
    'Deposit Return'
  ],
  Other: [
    'Cash Back Reward',
    'Survey Reward',
    'Lottery Winning',
    'Rebate',
    'Miscellaneous Income'
  ]
};

// Function to generate a random number between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get a random element from an array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate a random transaction
function generateTransaction(userId: string, date: Date): Transaction {
  // 80% chance of expense, 20% chance of income
  const isExpense = Math.random() < 0.8;
  
  if (isExpense) {
    const category = getRandomElement(expenseCategories);
    const descriptions = expenseDescriptions[category];
    const description = getRandomElement(descriptions);
    
    // Determine payment method (Amex or Chase for expenses)
    const paymentMethod = Math.random() < 0.5 ? 'Amex' : 'Chase';
    
    // Generate a realistic amount based on category
    let amount: number;
    switch (category) {
      case 'Housing':
        amount = getRandomInt(800, 2500);
        break;
      case 'Travel':
        amount = getRandomInt(100, 1500);
        break;
      case 'Groceries':
        amount = getRandomInt(30, 200);
        break;
      case 'Dining':
        amount = getRandomInt(15, 150);
        break;
      case 'Utilities':
        amount = getRandomInt(50, 300);
        break;
      case 'Healthcare':
        amount = getRandomInt(20, 500);
        break;
      default:
        amount = getRandomInt(10, 200);
    }
    
    return {
      amount: -amount, // Negative for expenses
      type: 'EXPENSE',
      category,
      description: `${description} (${paymentMethod})`,
      date,
      userId
    };
  } else {
    // Income transaction
    const category = getRandomElement(incomeCategories);
    const descriptions = incomeDescriptions[category];
    const description = getRandomElement(descriptions);
    
    // Generate a realistic amount based on category
    let amount: number;
    switch (category) {
      case 'Salary':
        amount = getRandomInt(2000, 5000);
        break;
      case 'Freelance':
        amount = getRandomInt(500, 2000);
        break;
      case 'Investments':
        amount = getRandomInt(100, 1000);
        break;
      default:
        amount = getRandomInt(50, 500);
    }
    
    return {
      amount, // Positive for income
      type: 'INCOME',
      category,
      description: `${description} (Checking)`,
      date,
      userId
    };
  }
}

// Main function to seed transactions
async function seedTransactions() {
  try {
    // Find the Test User
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    });

    let userId: string;
    if (!testUser) {
      console.log('Test User not found. Creating a new Test User...');
      // Create a Test User if not found
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2b$10$dJoCrMGKCPGO7VT4ZYaSzOewQxFTWfFJJRUIVuJmZ5QEU.jFXkKcS', // hashed 'password123'
          name: 'Test User'
        }
      });
      console.log(`Created Test User with ID: ${newUser.id}`);
      userId = newUser.id;
    } else {
      console.log(`Found Test User with ID: ${testUser.id}`);
      userId = testUser.id;
    }

    // Delete existing transactions for this user
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        userId: userId
      }
    });
    console.log(`Deleted ${deletedTransactions.count} existing transactions`);

    // Generate transactions from November 2024 to March 13, 2025
    const startDate = new Date('2024-11-01');
    const endDate = new Date('2025-03-13');
    
    // Create an array to hold all transactions
    const transactions: Transaction[] = [];
    
    // Generate 2-5 transactions per day
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const transactionsPerDay = getRandomInt(2, 5);
      
      for (let i = 0; i < transactionsPerDay; i++) {
        // Add some randomness to the time of day
        const transactionDate = new Date(currentDate);
        transactionDate.setHours(getRandomInt(8, 22), getRandomInt(0, 59));
        
        const transaction = generateTransaction(userId, transactionDate);
        transactions.push(transaction);
      }
      
      // Move to the next day
      currentDate = addDays(currentDate, 1);
    }
    
    // Add bi-weekly salary payments (every other Friday)
    let salaryDate = new Date(startDate);
    // Find the first Friday
    while (salaryDate.getDay() !== 5) {
      salaryDate = addDays(salaryDate, 1);
    }
    
    // Add salary every other Friday
    while (salaryDate <= endDate) {
      const salaryTransaction: Transaction = {
        amount: getRandomInt(3000, 4000),
        type: 'INCOME',
        category: 'Salary',
        description: 'Bi-weekly Paycheck (Checking)',
        date: salaryDate,
        userId
      };
      
      transactions.push(salaryTransaction);
      
      // Move to the next bi-weekly Friday
      salaryDate = addDays(salaryDate, 14);
    }
    
    // Add monthly rent/mortgage payment (1st of each month)
    let rentDate = new Date(startDate);
    rentDate.setDate(1);
    
    // If start date is after the 1st of the month, move to the next month
    if (startDate.getDate() > 1) {
      rentDate.setMonth(rentDate.getMonth() + 1);
    }
    
    // Add rent payment on the 1st of each month
    while (rentDate <= endDate) {
      const rentTransaction: Transaction = {
        amount: -getRandomInt(1500, 2500),
        type: 'EXPENSE',
        category: 'Housing',
        description: 'Monthly Rent Payment (Chase)',
        date: rentDate,
        userId
      };
      
      transactions.push(rentTransaction);
      
      // Move to the 1st of the next month
      rentDate.setMonth(rentDate.getMonth() + 1);
    }
    
    // Add monthly utility bills (between 10th-15th of each month)
    let utilityDate = new Date(startDate);
    utilityDate.setDate(getRandomInt(10, 15));
    
    // If start date is after the utility date, move to the next month
    if (startDate.getDate() > utilityDate.getDate()) {
      utilityDate.setMonth(utilityDate.getMonth() + 1);
    }
    
    // Add utility bills each month
    while (utilityDate <= endDate) {
      const utilities: Transaction[] = [
        {
          amount: -getRandomInt(50, 120),
          type: 'EXPENSE',
          category: 'Utilities',
          description: 'Electricity Bill (Amex)',
          date: new Date(utilityDate),
          userId
        },
        {
          amount: -getRandomInt(40, 80),
          type: 'EXPENSE',
          category: 'Utilities',
          description: 'Water Bill (Chase)',
          date: new Date(addDays(utilityDate, 1)),
          userId
        },
        {
          amount: -getRandomInt(60, 100),
          type: 'EXPENSE',
          category: 'Utilities',
          description: 'Internet Service (Amex)',
          date: new Date(addDays(utilityDate, 2)),
          userId
        }
      ];
      
      transactions.push(...utilities);
      
      // Move to the next month (same day)
      utilityDate.setMonth(utilityDate.getMonth() + 1);
    }
    
    // Add monthly subscriptions (around 20th of each month)
    let subscriptionDate = new Date(startDate);
    subscriptionDate.setDate(getRandomInt(18, 22));
    
    // If start date is after the subscription date, move to the next month
    if (startDate.getDate() > subscriptionDate.getDate()) {
      subscriptionDate.setMonth(subscriptionDate.getMonth() + 1);
    }
    
    // Add subscriptions each month
    while (subscriptionDate <= endDate) {
      const subscriptions: Transaction[] = [
        {
          amount: -14.99,
          type: 'EXPENSE',
          category: 'Subscriptions',
          description: 'Netflix Subscription (Chase)',
          date: new Date(subscriptionDate),
          userId
        },
        {
          amount: -9.99,
          type: 'EXPENSE',
          category: 'Subscriptions',
          description: 'Spotify Premium (Amex)',
          date: new Date(addDays(subscriptionDate, 1)),
          userId
        },
        {
          amount: -12.99,
          type: 'EXPENSE',
          category: 'Subscriptions',
          description: 'Amazon Prime (Chase)',
          date: new Date(addDays(subscriptionDate, 2)),
          userId
        }
      ];
      
      transactions.push(...subscriptions);
      
      // Move to the next month (same day)
      subscriptionDate.setMonth(subscriptionDate.getMonth() + 1);
    }
    
    // Create all transactions in the database
    const createdTransactions = await prisma.transaction.createMany({
      data: transactions
    });
    
    console.log(`Created ${createdTransactions.count} transactions`);
    
    // Calculate some statistics
    const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`Total Expense: $${Math.abs(totalExpense).toFixed(2)}`);
    console.log(`Net Cash Flow: $${(totalIncome + totalExpense).toFixed(2)}`);
    
    // Create some budgets for the user
    await prisma.budget.deleteMany({
      where: {
        userId: userId
      }
    });
    
    const budgets = [
      {
        category: 'Groceries',
        amount: 600,
        period: 'monthly',
        userId
      },
      {
        category: 'Dining',
        amount: 400,
        period: 'monthly',
        userId
      },
      {
        category: 'Entertainment',
        amount: 200,
        period: 'monthly',
        userId
      },
      {
        category: 'Shopping',
        amount: 300,
        period: 'monthly',
        userId
      },
      {
        category: 'Transportation',
        amount: 250,
        period: 'monthly',
        userId
      },
      {
        category: 'Utilities',
        amount: 350,
        period: 'monthly',
        userId
      },
      {
        category: 'Housing',
        amount: 2000,
        period: 'monthly',
        userId
      }
    ];
    
    const createdBudgets = await prisma.budget.createMany({
      data: budgets
    });
    
    console.log(`Created ${createdBudgets.count} budgets`);
    
  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTransactions()
  .then(() => console.log('Transaction seeding completed'))
  .catch(e => console.error('Error in transaction seeding:', e)); 