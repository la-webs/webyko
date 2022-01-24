-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "nicknameEn" TEXT NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);
