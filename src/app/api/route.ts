export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: "transaction get" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  return new Response(JSON.stringify({ message: "transaction post" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request: Request) {
  return new Response(JSON.stringify({ message: "transaction post" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(request: Request) {
  return new Response(JSON.stringify({ message: "transaction post" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
