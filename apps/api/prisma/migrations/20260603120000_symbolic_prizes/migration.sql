ALTER TABLE "groups"
  ADD COLUMN "symbolic_prize_total" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "group_prize_rules" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "percentage" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "group_prize_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_prize_rules_group_id_position_key"
  ON "group_prize_rules"("group_id", "position");

ALTER TABLE "group_prize_rules"
  ADD CONSTRAINT "group_prize_rules_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
