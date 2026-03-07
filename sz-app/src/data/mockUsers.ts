import { IUser } from "@/types/task";

// Mock users for the project management system
export const mockUsers: IUser[] = [
    {
        id: "u1",
        name: "Sarah Miller",
        email: "sarah.miller@saleszium.com",
        avatar: undefined,
        role: "Product Manager",
    },
    {
        id: "u2",
        name: "John Doe",
        email: "john.doe@saleszium.com",
        avatar: undefined,
        role: "Senior Developer",
    },
    {
        id: "u3",
        name: "Emma Wilson",
        email: "emma.wilson@saleszium.com",
        avatar: undefined,
        role: "UI/UX Designer",
    },
    {
        id: "u4",
        name: "Mike Brown",
        email: "mike.brown@saleszium.com",
        avatar: undefined,
        role: "Backend Developer",
    },
    {
        id: "u5",
        name: "Lisa Chen",
        email: "lisa.chen@saleszium.com",
        avatar: undefined,
        role: "QA Engineer",
    },
    {
        id: "u6",
        name: "David Kumar",
        email: "david.kumar@saleszium.com",
        avatar: undefined,
        role: "DevOps Engineer",
    },
];

// Helper to get a random user
export const getRandomUser = (): IUser => {
    return mockUsers[Math.floor(Math.random() * mockUsers.length)];
};

// Helper to get user by ID
export const getUserById = (id: string): IUser | undefined => {
    return mockUsers.find((user) => user.id === id);
};
