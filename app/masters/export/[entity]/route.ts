import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EXPORT_SPECS, buildWorkbook, type ExportEntity } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;

  if (!Object.prototype.hasOwnProperty.call(EXPORT_SPECS, entity)) {
    return NextResponse.json({ error: "Unknown export." }, { status: 404 });
  }
  const key = entity as ExportEntity;
  const spec = EXPORT_SPECS[key];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "A setting is missing." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from(spec.table)
    .select(spec.select)
    .order(spec.columns[0].key, { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const buffer = await buildWorkbook(
    key,
    (data ?? []) as unknown as Record<string, unknown>[],
  );
  const filename = `${key}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
