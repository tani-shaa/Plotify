/**
 * Skeleton loaders — match the real layout shape exactly.
 * Used on Dashboard, Properties, Transfers, Insights pages.
 */

const pulse = {
  background: "linear-gradient(90deg, #E9EFE7 25%, #F3F5F1 50%, #E9EFE7 75%)",
  backgroundSize: "200% 100%",
  animation: "skeletonPulse 1.4s ease infinite",
  borderRadius: 6,
};

export function SkeletonBox({ w = "100%", h = 16, r = 6, mb = 0 }) {
  return (
    <div style={{ ...pulse, width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />
  );
}

export function SkeletonCard({ children, p = 24 }) {
  return (
    <div style={{ background: "white", border: "1px solid #EAEDEA", borderRadius: 14, padding: p, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

/* 4-column stat grid skeleton */
export function StatGridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <SkeletonBox w={44} h={44} r={12} />
            <SkeletonBox w={48} h={22} r={20} />
          </div>
          <SkeletonBox w="55%" h={34} r={6} mb={8} />
          <SkeletonBox w="70%" h={14} r={4} />
        </SkeletonCard>
      ))}
    </div>
  );
}

/* Table rows skeleton */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ background: "white", border: "1px solid #EAEDEA", borderRadius: 14, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 20px", background: "#F8F7F2", borderBottom: "1px solid #EAEDEA", display: "flex", gap: 16 }}>
        {[...Array(cols)].map((_, i) => <SkeletonBox key={i} w={`${60 + i * 20}px`} h={12} />)}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, r) => (
        <div key={r} style={{ padding: "14px 20px", borderBottom: r < rows - 1 ? "1px solid #F3F4F6" : "none", display: "flex", gap: 16, alignItems: "center" }}>
          {[...Array(cols)].map((_, c) => (
            <SkeletonBox key={c} w={`${50 + ((r * c + c) % 5) * 15}px`} h={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Dashboard full skeleton */
export function DashboardSkeleton() {
  return (
    <div className="page-content">
      <style>{`@keyframes skeletonPulse{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
      {/* Welcome row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div><SkeletonBox w={180} h={14} mb={8} /><SkeletonBox w={260} h={28} /></div>
        <SkeletonBox w={140} h={42} r={9} />
      </div>
      {/* Stats */}
      <StatGridSkeleton />
      {/* Two col */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 20 }}>
        <SkeletonCard p={24}><SkeletonBox w="40%" h={18} mb={8} /><SkeletonBox w="60%" h={14} mb={20} /><SkeletonBox w="100%" h={180} r={10} /></SkeletonCard>
        <SkeletonCard p={24}><SkeletonBox w="40%" h={18} mb={8} /><SkeletonBox w="60%" h={14} mb={20} /><SkeletonBox w={140} h={140} r={70} style={{ margin: "0 auto" }} /><SkeletonBox w="100%" h={80} r={6} mb={0} style={{ marginTop: 16 }} /></SkeletonCard>
      </div>
      {/* Bottom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <SkeletonCard p={0}><div style={{ padding: "16px 20px", borderBottom: "1px solid #EAEDEA" }}><SkeletonBox w={200} h={16} /></div>{[...Array(4)].map((_, i) => <div key={i} style={{ padding: "13px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 16 }}>{[100,80,80,80,100].map((w, c) => <SkeletonBox key={c} w={w} h={14} />)}</div>)}</SkeletonCard>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonCard p={20}><div style={{ display: "flex", gap: 12 }}><SkeletonBox w={42} h={42} r={11} /><div style={{ flex: 1 }}><SkeletonBox w="60%" h={16} mb={8} /><SkeletonBox w="90%" h={12} mb={6} /><SkeletonBox w="80%" h={12} /></div></div></SkeletonCard>
          <SkeletonCard p={8}>{[...Array(4)].map((_, i) => <div key={i} style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "center", marginBottom: 2 }}><SkeletonBox w={34} h={34} r={9} /><div style={{ flex: 1 }}><SkeletonBox w="60%" h={13} mb={5} /><SkeletonBox w="40%" h={10} /></div></div>)}</SkeletonCard>
        </div>
      </div>
    </div>
  );
}

/* Page-level generic skeleton */
export function PageSkeleton({ title = true }) {
  return (
    <div className="page-content">
      <style>{`@keyframes skeletonPulse{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
      {title && <div style={{ marginBottom: 24 }}><SkeletonBox w={220} h={26} mb={8} /><SkeletonBox w={340} h={14} /></div>}
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
