# postgres-helper

The all-in-one postgres module for SQL enjoyers.

### Features

This module acts as a convenient wrapper around the [postgres](https://github.com/porsager/postgres) and [kanel](https://github.com/kristiandupont/kanel) packages, while also stealing some code from [ley](https://github.com/lukeed/ley). It offers a seamless integration of their functionalities:

- [Simplified SQL query execution](#queries) using ES6 Tagged Template Strings with enforced safety
- [Migration solution](#migrations) built on top of the Tagged Template Strings
- [Type generation](#type-generation) automatically after migrations

## Queries

Simply import `sql` to use it everywhere:

```js
import sql from "postgres-helper";

async function getPeopleOver(age) {
  return await sql`SELECT * FROM person WHERE age > ${age}`;
}
```

No annoying ORM syntax, no need to manually escape your values. Just write your queries.

If you [setup](#setup) the module to use TypeScript, you can utilize the automatically [generated types](#type-generation) from the [migration system](#migrations) to specify the return type of your queries.

```ts
import Person from "postgres-helper/types/public/Person";

async function insertPerson(name: string, age: number): Promise<Person> {
  const newPerson = await sql<
    Person[]
  >`INSERT INTO person (name, age) VALUES (${name}, ${age}) RETURNING *`;
  return newPerson[0];
}
```

For more information on how to use the `sql` function, check out the [postgres documentation](https://github.com/porsager/postgres#queries).

## Migrations

Before you can start querying your database, you need some tables. You can create them using the inbuilt migration system.

Creating a migration:

```bash
npx postgres-helper new <migration-name>
```

The generated migration file will look like this, allowing you to migrate with the syntax you already know from your [queries](#queries) (`sql` is available out of the box in migration files):

```js
exports.up = async (sql) => {
  await sql`
        CREATE TABLE person (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            age INT NOT NULL
        );
    `;
};

exports.down = async (sql) => {
  await sql`
        DROP TABLE person;
    `;
};
```

Running migrations:

```bash
npx postgres-helper up
```

Rolling back a migration:

```bash
npx postgres-helper down
```

For an overview over all available migration commands and arguments, run:

```bash
npx postgres-helper --help
```

## Type generation

If the `outputPath` is set correctly in your [configuration](#configuration), _postgres-helper_ will automatically introspect the database and generate types for you after each migration. The generated types will reflect the current state of your database (not only the content of your migrations).

As the generated types are overwritten after each migration, you should not edit them in the `outputPath` directory.

### Manual generation

If you want to generate the types independently of the migrations, you can run:

```bash
npx postgres-helper typegen
```

If you need to go in-depth with the generated types, you can refer to the [kanel documentation](https://kristiandupont.github.io/kanel).

## Setup

1. Install the package:

   ```bash
   npm install postgres-helper
   ```

2. Run the initialization command (if you want automatically generated types, add the `--typescript` flag):

   ```bash
   npx postgres-helper init --typescript
   ```

3. Edit the generated `phconfig.js` file in the `postgres-helper` directory to match your database [configuration](#configuration)

## Configuration

The `phconfig.js` file looks like this:

```js
module.exports = {
  connection: {
    host: "localhost",
    port: 5432,
    database: "database",
    username: "username",
    password: "password",
  },
  migrationPath: "./postgres-helper/migrations",
  outputPath: "./postgres-helper/types",
};
```

The `connection` object needs to match your database configuration. The default options are generally adequate, but if you require additional customization, you can refer to the [advanced configuration options](https://github.com/porsager/postgres#all-postgres-options). Simply add the desired options to the `connection` object.

The `migrationPath` is the path to the directory where your migration files are stored. Just keep the default. Please.

The `outputPath` is the path to the directory where the generated types are stored. If you didn't set the `--typescript` flag when running the initialization command, this line won't exist in your config and _postgres-helper_ will not [generate types](#type-generation) for you.

## Thanks

To all the original package authors.
