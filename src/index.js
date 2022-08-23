const express = require('express');
const { v4: uuidv4 } = require('uuid');


const app = express();


app.use(express.json());


const customers = [];


// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Usuário não cadastrado!" });
    }

    req.customer = customer;

    return next();

};

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
};


app.post('/account', async (req, res) => {
    try {


        const { cpf, name } = req.body;


        const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);


        if (customerAlreadyExists) {
            return res.status(400).json({ error: "Cpf já cadastrado!" });
        }


        customers.push({
            cpf,
            name,
            id: uuidv4(),
            statement: []
        });


        return res.status(201).send('Conta criada com sucesso!');



    } catch (error) {

        return res.status(500).send(error.message);
    }

});

// app.use(verifyIfExistsAccountCPF);

app.get('/statement', verifyIfExistsAccountCPF, async (req, res) => {
    try {

        const { customer } = req;

        return res.json(customer.statement);

    } catch (error) {

        return res.status(500).send(error.message);
    }
});

app.post('/deposit', verifyIfExistsAccountCPF, async (req, res) => {
    try {
        const { description, amount } = req.body;

        const { customer } = req;

        const statementOperation = {
            description,
            amount,
            created_at: new Date(),
            type: 'credit',
        }

        customer.statement.push(statementOperation);

        return res.status(201).send();

    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.post('/withdraw', verifyIfExistsAccountCPF, async (req, res) => {
    try {

        const { amount } = req.body;
        const { customer } = req;

        const balance = getBalance(customer.statement);

        if (balance < amount) {
            return res.status(400).json({ error: 'Saldo insuficiente!' });
        };

        const statementOperation = {
            amount,
            created_at: new Date(),
            type: 'debit',
        };

        customer.statement.push(statementOperation);

        return res.status(201).send();

    } catch (error) {

        res.status(500).send(error.message)
    }

});

app.get('/statement/date', verifyIfExistsAccountCPF, async (req, res) => {
    try {
        const { customer } = req;
        const { date } = req.query;

        const dateFormat = new Date(date + ' 00:00');

        const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date
            (dateFormat).toDateString());

        return res.json(statement);

    } catch (error) {

        return res.status(500).send(error.message);
    }
});

app.put('/account', verifyIfExistsAccountCPF, async (req, res) => {
    try {

        const name = req.body;
        const { customer } = req;

        customer.name = name;

        return res.status(201).send();

    } catch (error) {

        return res.status(500).send(error.message);
    }
});

app.get('/account', verifyIfExistsAccountCPF, async (req, res) => {

    const { customer } = req;

    return res.json(customer);
});

app.delete('/account', verifyIfExistsAccountCPF, async (req, res) => {
    try {

        const { customer } = req;

        // splice
        customers.splice(customer, 1);

        return res.status(200).json(customers);

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

app.get('/balance', verifyIfExistsAccountCPF, async (req, res) => {
    try {
        const { customer } = req;

        const balance = getBalance(customer.statement);

        return res.json(balance);

    } catch (error) {
        return res.status(500).send(error.message);
    }

});

const port = 3333;

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));