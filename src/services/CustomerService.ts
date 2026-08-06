export class CustomerService {

    async findCustomer(customerId: string) {

        console.log(`[CustomerService] Searching ${customerId}`);

        return {
            id: customerId,
            name: "John Doe",
            email: "john@example.com"
        };

    }

}