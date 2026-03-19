/**
 * JSON-LD Script Component
 *
 * Renders structured data for SEO.
 * Note: Using dangerouslySetInnerHTML is safe here because
 * we control the data being serialized (internal schema objects).
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Multiple JSON-LD scripts
 */
interface MultiJsonLdProps {
  data: Record<string, unknown>[];
}

export function MultiJsonLd({ data }: MultiJsonLdProps) {
  return (
    <>
      {data.map((item, index) => (
        <JsonLd key={index} data={item} />
      ))}
    </>
  );
}
