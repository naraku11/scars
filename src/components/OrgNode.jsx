import styles from './OrgNode.module.css'

export default function OrgNode({ node, isRoot = false }) {
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className={styles.nodeWrapper}>
      <div className={`${styles.node} ${isRoot ? styles.root : ''}`}>
        {node.label}
      </div>

      {hasChildren && (
        <div className={styles.childrenContainer}>
          <div className={styles.verticalLine} />
          <div className={styles.horizontalBar} />
          <div className={styles.children}>
            {node.children.map((child) => (
              <div key={child.id} className={styles.childBranch}>
                <div className={styles.childVerticalLine} />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
