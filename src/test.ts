import { Column, Connection, createConnection, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

@Entity()
class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ nullable: true })
  userId?: number;
}

describe("Issue Report", () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = await createConnection({
      type: "sqlite",
      database: "sqlite",
      dropSchema: true,
      logging: true,
      synchronize: true,
      entities: [User, Action],
    });
  });

  afterAll(() => connection.close());

  it("persists changes to userId", async () => {
    // First I create a user
    const userRepo = connection.manager.getRepository(User);
    const actionRepo = connection.manager.getRepository(Action);
    const user = userRepo.create({ name: "Tester" });
    await userRepo.save(user);

    // And add an action
    const action = actionRepo.create({ description: "Demonstrate the issue" });
    await actionRepo.save(action);

    // the userId is null as you'd expect
    expect(action.userId).toBeNull();
    // and it is fetched as well!
    const fetchedAction = await actionRepo.findOne({ where: { id: action.id }, relations: { user: true } });

    expect(fetchedAction.userId).toBeNull();
    expect(fetchedAction.user).toBeNull();

    fetchedAction.userId = user.id;
    await actionRepo.save(fetchedAction);
    // and the userId and user should have been changed
    expect(fetchedAction.userId).toBe(user.id);
    expect(fetchedAction.user).not.toBeNull();
    // however - the update statement fails
    // query: UPDATE "action" SET "userId" = ?, "userId" = ? WHERE "id" IN (1) -- PARAMETERS: [1]
  });
});
