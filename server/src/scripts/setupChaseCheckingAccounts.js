"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var sync_1 = require("csv-parse/sync");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var user, deletedBofAAccounts, existingChaseAccounts, deletedChaseAccounts, chaseAccounts, createdAccounts, newChaseAccounts, accountCsvMap, _i, accountCsvMap_1, _a, account, csvPath, csvContent, records, _b, records_1, record, description, isTransfer, transactionType, amount, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Starting Chase checking accounts setup...');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 16, 17, 19]);
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { email: 'test@example.com' }
                        })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        console.error('No test user found. Please run the createUser script first.');
                        return [2 /*return*/];
                    }
                    console.log("Found user: ".concat(user.name, " (").concat(user.id, ")"));
                    return [4 /*yield*/, prisma.account.deleteMany({
                            where: {
                                userId: user.id,
                                institution: 'Bank of America'
                            }
                        })];
                case 3:
                    deletedBofAAccounts = _c.sent();
                    console.log("Deleted ".concat(deletedBofAAccounts.count, " Bank of America accounts"));
                    return [4 /*yield*/, prisma.account.findMany({
                            where: {
                                userId: user.id,
                                institution: 'Chase Bank',
                                type: 'checking'
                            }
                        })];
                case 4:
                    existingChaseAccounts = _c.sent();
                    if (!(existingChaseAccounts.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.account.deleteMany({
                            where: {
                                userId: user.id,
                                institution: 'Chase Bank',
                                type: 'checking'
                            }
                        })];
                case 5:
                    deletedChaseAccounts = _c.sent();
                    console.log("Deleted ".concat(deletedChaseAccounts.count, " existing Chase checking accounts"));
                    _c.label = 6;
                case 6:
                    chaseAccounts = [
                        {
                            name: 'Chase Checking Primary',
                            type: 'checking',
                            balance: 5000.00,
                            institution: 'Chase Bank',
                            lastFour: '5432',
                            color: '#10B981', // Green
                            userId: user.id
                        },
                        {
                            name: 'Chase Checking Secondary',
                            type: 'checking',
                            balance: 3500.50,
                            institution: 'Chase Bank',
                            lastFour: '7890',
                            color: '#3B82F6', // Blue
                            userId: user.id
                        }
                    ];
                    return [4 /*yield*/, prisma.account.createMany({
                            data: chaseAccounts
                        })];
                case 7:
                    createdAccounts = _c.sent();
                    console.log("Created ".concat(createdAccounts.count, " Chase checking accounts"));
                    return [4 /*yield*/, prisma.account.findMany({
                            where: {
                                userId: user.id,
                                institution: 'Chase Bank',
                                type: 'checking'
                            }
                        })];
                case 8:
                    newChaseAccounts = _c.sent();
                    if (newChaseAccounts.length !== 2) {
                        console.error('Error: Could not find the newly created Chase accounts');
                        return [2 /*return*/];
                    }
                    accountCsvMap = [
                        {
                            account: newChaseAccounts[0], // Primary account
                            csvPath: path_1.default.resolve(__dirname, '../../../resources/Chase_checking1.csv')
                        },
                        {
                            account: newChaseAccounts[1], // Secondary account
                            csvPath: path_1.default.resolve(__dirname, '../../../resources/Chase_checking2.csv')
                        }
                    ];
                    _i = 0, accountCsvMap_1 = accountCsvMap;
                    _c.label = 9;
                case 9:
                    if (!(_i < accountCsvMap_1.length)) return [3 /*break*/, 15];
                    _a = accountCsvMap_1[_i], account = _a.account, csvPath = _a.csvPath;
                    console.log("Importing transactions for account: ".concat(account.name, " (").concat(account.id, ")"));
                    // Check if CSV file exists
                    if (!fs_1.default.existsSync(csvPath)) {
                        console.error("CSV file not found: ".concat(csvPath));
                        return [3 /*break*/, 14];
                    }
                    csvContent = fs_1.default.readFileSync(csvPath, 'utf8');
                    records = (0, sync_1.parse)(csvContent, {
                        columns: true,
                        skip_empty_lines: true
                    });
                    console.log("Found ".concat(records.length, " transactions in CSV file"));
                    _b = 0, records_1 = records;
                    _c.label = 10;
                case 10:
                    if (!(_b < records_1.length)) return [3 /*break*/, 13];
                    record = records_1[_b];
                    description = record.Description || '';
                    isTransfer = description.toLowerCase().includes('transfer');
                    if (isTransfer) {
                        console.log("Skipping transfer transaction: ".concat(description));
                        return [3 /*break*/, 12];
                    }
                    transactionType = 'expense';
                    amount = parseFloat(record.Amount);
                    if (amount > 0) {
                        transactionType = 'income';
                    }
                    else {
                        // Make sure expenses are positive in our database
                        amount = Math.abs(amount);
                    }
                    // Create transaction
                    return [4 /*yield*/, prisma.transaction.create({
                            data: {
                                amount: amount,
                                type: transactionType,
                                category: record.Category || 'Uncategorized',
                                description: record.Description || '',
                                date: new Date(record.Date),
                                originalDescription: record.Description || '',
                                vendor: record['Card Member'] || '',
                                accountNumber: record['Account #'] || '',
                                source: 'csv',
                                bankName: 'Chase Bank',
                                userId: user.id,
                                accountId: account.id
                            }
                        })];
                case 11:
                    // Create transaction
                    _c.sent();
                    _c.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log("Imported transactions for account: ".concat(account.name));
                    _c.label = 14;
                case 14:
                    _i++;
                    return [3 /*break*/, 9];
                case 15: return [3 /*break*/, 19];
                case 16:
                    error_1 = _c.sent();
                    console.error('Error setting up Chase checking accounts:', error_1);
                    return [3 /*break*/, 19];
                case 17: return [4 /*yield*/, prisma.$disconnect()];
                case 18:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return console.log('Chase checking accounts setup completed'); })
    .catch(function (e) { return console.error('Error in Chase checking accounts setup script:', e); });
