export type UmlElement = {
  id: string;
  name?: string;
  type: string;
  stereotype?: string;
  package?: string;
  depth?: number;
  direction?: string;
};

export type UmlRelationship = {
  id: string;
  type: string;
  source?: string;
  target?: string;
  name?: string;
};

export type DiagramInfo = {
  name?: string;
  mdType?: string;
};

export type ClassStat = {
  className?: string;
  umlId?: string;
  attributes?: number;
  ports?: number;
  connectors?: number;
  maybeSysmlBlock?: boolean;
};

export type Metrics = {
  classes: number;
  profiles: number;
  stereotypes: number;
  associations: number;
  generalizations: number;
  dependencies: number; // NEU
  properties: number;
  ports: number;
  connectors: number;
  parameters: number; // NEU
  useCases: number;
  activities: number;
  packages: number;
  diagramsTotal: number;
  unnamedElements: number; // NEU
  blocksEstimated: number;
  abstraction: number;
  unknownElements: number;
  portDirectionIssues?: number;
  redundantElements?: number;
  generalIssues?: number;

  // NEU (aus classStats abgeleitet)
};

export interface QualityMetrics {
  unnamedPerPackage: {
    package: string;
    unnamed: number;
    total: number;
    ratio: number;
  }[];
  portsWithoutType: number;
  emptyPackages: number;
}

export type ParsedModel = {
  elements: UmlElement[];
  relationships: UmlRelationship[];
  meta: {
    elementCount: number;
    relationshipCount: number;
  };
  metrics: Metrics;
  diagramsByType: Record<string, number>;
  diagramList: DiagramInfo[];
  classStats: ClassStat[];
  quality?: QualityMetrics;
};
