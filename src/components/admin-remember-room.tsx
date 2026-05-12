"use client";

import { useEffect } from "react";

import { saveAdminRoom } from "@/lib/local-admin-rooms";

type AdminRememberRoomProps = {
  room: {
    id: string;
    title: string;
    joinCode: string;
    adminToken: string;
    accentColor: string;
    organizationName: string;
    logoUrl: string;
  };
};

export function AdminRememberRoom({ room }: AdminRememberRoomProps) {
  useEffect(() => {
    void saveAdminRoom({
      roomId: room.id,
      title: room.title,
      joinCode: room.joinCode,
      adminToken: room.adminToken,
      accentColor: room.accentColor,
      organizationName: room.organizationName,
      logoUrl: room.logoUrl,
      updatedAt: new Date().toISOString(),
    });
  }, [
    room.accentColor,
    room.adminToken,
    room.id,
    room.joinCode,
    room.logoUrl,
    room.organizationName,
    room.title,
  ]);

  return null;
}
