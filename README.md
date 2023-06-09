# postgres-helper

![npm](https://img.shields.io/npm/v/postgres-helper)
![npm](https://img.shields.io/npm/dt/postgres-helper)
![GitHub](https://img.shields.io/github/license/SamuelDietz/postgres-helper)

The all-in-one postgres module for SQL enjoyers.

### Features

- Simple and safe SQL queries with the [postgres](https://github.com/porsager/postgres) client
- Easy database management with the inbuilt migration system
- (For TypeScript users): Automatic type generation using [kanel](https://github.com/kristiandupont/kanel)

## Queries

After [setting up the database connection](#setup), simply import `sql` to use it everywhere:

```js
import sql from "postgres-helper";

async function getPeopleOver(age) {
  return await sql`SELECT * FROM person WHERE age > ${age}`;
}
```

If you use TypeScript, you can utilize the automatically [generated types](#type-generation) from the [migration system](#migrations) to specify the return type of your queries:

```ts
import Person from "postgres-helper/types/public/Person";

async function insertPerson(name: string, age: number): Promise<Person> {
  const newPerson = await sql<
    Person[]
  >`INSERT INTO person (name, age) VALUES (${name}, ${age}) RETURNING *`;
  return newPerson[0];
}
```

## Query building features

The simple dynamic query builder conditionally appends/omits query fragments. It works by nesting ` sql`` ` fragments within other ` sql`` ` calls or fragments. This allows you to build dynamic queries safely without risking sql injections through usual string concatenation.

### Partial queries
```js
const olderThan = x => sql`and age > ${ x }`

const filterAge = true

sql`
  select
   *
  from users
  where name is not null ${
    filterAge
      ? olderThan(50)
      : sql``
  }
`
// Which results in:
select * from users where name is not null
// Or
select * from users where name is not null and age > 50
```

### Dynamic filters
```js
sql`
  select
    *
  from users ${
    id
      ? sql`where user_id = ${ id }`
      : sql``
  }
`

// Which results in:
select * from users
// Or
select * from users where user_id = $1
```

### SQL functions
Using keywords or calling functions dynamically is also possible by using ``` sql`` ``` fragments.
```js
const date = null

sql`
  update users set updated_at = ${ date || sql`now()` }
`

// Which results in:
update users set updated_at = now()
```

### Table names
Dynamic identifiers like table names and column names is also supported like so:
```js
const table = 'users'
    , column = 'id'

sql`
  select ${ sql(column) } from ${ sql(table) }
`

// Which results in:
select "id" from "users"
```

### Quick primer on interpolation

Here's a quick oversight over all the ways to do interpolation in a query template string:

| Interpolation syntax       | Usage                         | Example                                                   |
| -------------              | -------------                 | -------------                                             |
| `${ sql`` }`               | for keywords or sql fragments | ``sql`SELECT * FROM users ${sql`order by age desc` }` ``  |
| `${ sql(string) }`         | for identifiers               | ``sql`SELECT * FROM ${sql('table_name')` ``               |
| `${ sql([] or {}, ...) }`  | for helpers                   | ``sql`INSERT INTO users ${sql({ name: 'Peter'})}` ``      |
| `${ 'somevalue' }`         | for values                    | ``sql`SELECT * FROM users WHERE age = ${42}` ``           |

For the full documentation on how to use the `sql` function, check out the [postgres docs](https://github.com/porsager/postgres#queries).

## Migrations

Before you can start querying your database, you need some tables. You can create them using the inbuilt migration system.

Creating a migration:

```bash
npx postgres-helper new <migration-name>
```

The generated migration file will look like this, allowing you to migrate with the syntax you already know from your [queries](#queries) (`sql` is available out of the box in migration files, no need to import it):

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

To generate types independently of migrations, you can run:

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

To the authors of the [postgres](https://github.com/porsager/postgres), [kanel](https://github.com/kristiandupont/kanel) and [ley](https://github.com/lukeed/ley) packages on which this module is built.