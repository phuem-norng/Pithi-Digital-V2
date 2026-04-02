'use server';

import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function applyTemplate(eventId: string, templateId: string, accessToken: string) {
  return fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ templateId }),
    cache: 'no-store',
  });
}

export async function applyTemplateToEvent(formData: FormData) {
  const eventId = String(formData.get('eventId') || '').trim();
  const templateId = String(formData.get('templateId') || '').trim();
  const accessToken = String(formData.get('accessToken') || '').trim();

  if (!eventId || !templateId || !accessToken) {
    redirect(`/events/${eventId || ''}?templateApplied=0&message=${encodeURIComponent('មិនអាចជ្រើសរើសគំរូធៀបបានទេ')}`);
  }

  try {
    const response = await applyTemplate(eventId, templateId, accessToken);

    if (!response.ok) {
      redirect(`/events/${eventId}?templateApplied=0&message=${encodeURIComponent('មិនអាចជ្រើសរើសគំរូធៀបបានទេ')}`);
    }

    redirect(`/events/${eventId}?templateApplied=1`);
  } catch {
    redirect(`/events/${eventId}?templateApplied=0&message=${encodeURIComponent('មិនអាចជ្រើសរើសគំរូធៀបបានទេ')}`);
  }
}

export async function previewTemplateForEvent(formData: FormData) {
  const eventId = String(formData.get('eventId') || '').trim();
  const templateId = String(formData.get('templateId') || '').trim();
  const accessToken = String(formData.get('accessToken') || '').trim();

  if (!eventId || !templateId || !accessToken) {
    redirect(`/events/${eventId || ''}?templateApplied=0&message=${encodeURIComponent('មិនអាចមើលគំរូធៀបបានទេ')}`);
  }

  try {
    const response = await applyTemplate(eventId, templateId, accessToken);

    if (!response.ok) {
      redirect(`/events/${eventId}?templateApplied=0&message=${encodeURIComponent('មិនអាចមើលគំរូធៀបបានទេ')}`);
    }

    redirect(`/invitation/${eventId}`);
  } catch {
    redirect(`/events/${eventId}?templateApplied=0&message=${encodeURIComponent('មិនអាចមើលគំរូធៀបបានទេ')}`);
  }
}
