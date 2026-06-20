import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function GroupTabs() {
  return (
    <Tabs defaultValue="matches" className="w-80">
      <TabsList>
        <TabsTrigger value="matches">Partidas</TabsTrigger>
        <TabsTrigger value="standings">Ranking</TabsTrigger>
        <TabsTrigger value="members">Membros</TabsTrigger>
      </TabsList>
      <TabsContent value="matches" className="text-muted-foreground">
        12 partidas registradas neste grupo.
      </TabsContent>
    </Tabs>
  );
}

export function Line() {
  return (
    <Tabs defaultValue="week" className="w-80">
      <TabsList variant="line">
        <TabsTrigger value="week">Semana</TabsTrigger>
        <TabsTrigger value="month">Mês</TabsTrigger>
        <TabsTrigger value="all">Geral</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
