import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB before compression)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compress and resize image using sharp
    const compressedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `avatar-${userId}-${timestamp}.jpg`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    const filepath = join(uploadDir, filename);

    // Save compressed image to file system
    await writeFile(filepath, compressedBuffer);

    // Create URL path for the image
    const imageUrl = `/uploads/avatars/${filename}`;

    // Delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (currentUser?.image && currentUser.image.startsWith('/uploads/avatars/')) {
      const oldFilePath = join(process.cwd(), 'public', currentUser.image);
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath).catch(err => console.log('Failed to delete old avatar:', err));
      }
    }

    // Update user's image path in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    console.log(`Avatar saved: ${filename} (${compressedBuffer.length} bytes)`);

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get current user's image path
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    // Delete file from filesystem if exists
    if (user?.image && user.image.startsWith('/uploads/avatars/')) {
      const filePath = join(process.cwd(), 'public', user.image);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(err => console.log('Failed to delete avatar file:', err));
      }
    }

    // Remove avatar from database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: null },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: 'Avatar removed successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
