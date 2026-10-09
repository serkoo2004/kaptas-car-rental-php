ALTER TABLE "User"
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "VerificationChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationChallenge_userId_channel_createdAt_idx"
ON "VerificationChallenge"("userId", "channel", "createdAt");

CREATE INDEX "VerificationChallenge_channel_target_idx"
ON "VerificationChallenge"("channel", "target");

CREATE INDEX "VerificationChallenge_expiresAt_idx"
ON "VerificationChallenge"("expiresAt");

ALTER TABLE "VerificationChallenge"
ADD CONSTRAINT "VerificationChallenge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
