/**
 * Short Project Redirect
 *
 * /p/[identifier] → /project/[identifier]
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ProjectShortRedirect({
  params,
  searchParams,
}: Props) {
  const { identifier } = await params;
  const { token } = await searchParams;

  const url = token
    ? `/project/${identifier}?token=${token}`
    : `/project/${identifier}`;

  redirect(url);
}
