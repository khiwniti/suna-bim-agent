/**
 * Short Chat Redirect
 *
 * /c/[identifier] → /chat/[identifier]
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ChatShortRedirect({
  params,
  searchParams,
}: Props) {
  const { identifier } = await params;
  const { token } = await searchParams;

  const url = token
    ? `/chat/${identifier}?token=${token}`
    : `/chat/${identifier}`;

  redirect(url);
}
