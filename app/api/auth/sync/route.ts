// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest){
//     try {
//         const {firebaseId, email, name, avatar} = await req.json();

//         if(!firebaseId || !email){
//             return NextResponse.json(
//                 {error: "Missing required fields"},
//                 {status: 400}
//             );
//         }

//         const user = await prisma.user.upsert({
//             where: {firebaseId},
//             update: {name, avatar},
//             create: {
//                 firebaseId,
//                 email,
//                 name,
//                 avatar,
//                 role: "USER",
//             },
//         });

//         return NextResponse.json(user);
//     } catch (error) {
//         console.error("Sync error: ", error);
//         return NextResponse.json(
//             {error: "Failed to sync user"},
//             {status: 500}
//         );
//     }
// }


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { firebaseId, email, name, avatar } = await req.json();

    if (!firebaseId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First check if a user exists with this email (e.g. from seed)
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    // If found by email but has different/no firebaseId → update it
    if (existingByEmail && existingByEmail.firebaseId !== firebaseId) {
      const updated = await prisma.user.update({
        where: { email },
        data:  { firebaseId, name, avatar },
      });
      return NextResponse.json(updated);
    }

    // Otherwise normal upsert by firebaseId
    const user = await prisma.user.upsert({
      where:  { firebaseId },
      update: { name, avatar },
      create: {
        firebaseId,
        email,
        name,
        avatar,
        role: "USER",
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("Sync error: ", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}