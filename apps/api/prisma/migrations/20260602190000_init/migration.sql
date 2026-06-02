CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "GroupRole" AS ENUM ('owner', 'member');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guesses" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "game_id" TEXT NOT NULL,
  "guess_home" INTEGER NOT NULL,
  "guess_away" INTEGER NOT NULL,
  "points" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "owner_user_id" TEXT NOT NULL,
  "invite_code" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_members" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "GroupRole" NOT NULL DEFAULT 'member',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "guesses_user_id_game_id_key" ON "guesses"("user_id", "game_id");
CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

ALTER TABLE "guesses"
  ADD CONSTRAINT "guesses_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_members"
  ADD CONSTRAINT "group_members_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_members"
  ADD CONSTRAINT "group_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
