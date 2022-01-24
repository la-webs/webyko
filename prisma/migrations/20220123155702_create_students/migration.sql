-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "nicknameEn" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
