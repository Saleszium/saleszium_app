export const markdownComponents = {
  p: ({ children }: any) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  ul: ({ children }: any) => (
    <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
  ),
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  a: ({ children, href }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline underline-offset-2 hover:text-blue-600"
    >
      {children}
    </a>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 text-[13px] font-mono">
        {children}
      </code>
    ) : (
      <code className="block rounded-lg bg-black/10 dark:bg-white/10 p-3 my-2 text-[13px] font-mono whitespace-pre-wrap">
        {children}
      </code>
    ),
  h1: ({ children }: any) => <h1 className="text-base font-semibold my-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-[15px] font-semibold my-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold my-1.5">{children}</h3>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-1.5 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
};
