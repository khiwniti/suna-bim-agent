/**
 * Short Workspace Redirect
 *
 * /w/[identifier] → /workspace/[identifier]
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function WorkspaceShortRedirect({
  params,
  searchParams,
}: Props) {
  const { identifier } = await params;
  const { token } = await searchParams;

  const url = token
    ? `/workspace/${identifier}?token=${token}`
    : `/workspace/${identifier}`;

  redirect(url);
}
