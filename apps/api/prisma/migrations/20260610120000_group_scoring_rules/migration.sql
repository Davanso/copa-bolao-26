CREATE TABLE "group_scoring_rules" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "exact_points" INTEGER NOT NULL DEFAULT 3,
  "result_points" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "group_scoring_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_scoring_rules_group_id_stage_key" ON "group_scoring_rules"("group_id", "stage");

ALTER TABLE "group_scoring_rules"
ADD CONSTRAINT "group_scoring_rules_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
