export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify is safe here; this is not user-generated content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

