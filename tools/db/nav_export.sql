-- ============================================================================
-- NAVEGAÇÃO ENTERPRISE - EXPORT NavPack
-- Gera JSON para backup/migração
-- ============================================================================

USE DSHOWDASH;

-- Export completo como JSON
SELECT JSON_OBJECT(
  'schemaVersion', '1.0.0',
  'exportedAt', NOW(),
  'exportedBy', 'system',
  
  'actions', (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'actionKey', a.action_key,
        'area', a.area,
        'kind', a.kind,
        'description', a.description,
        'activeBinding', (
          SELECT JSON_OBJECT(
            'effect', br.effect,
            'params', br.params_json
          )
          FROM app_nav_binding_active ba
          JOIN app_nav_binding_revision br ON br.binding_rev_id = ba.binding_rev_id
          WHERE ba.action_id = a.action_id
        )
      )
    )
    FROM app_nav_action a
  ),
  
  'destinations', (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'destinationKey', d.destination_key,
        'type', d.destination_type,
        'title', d.title,
        'isActive', d.is_active
      )
    )
    FROM app_nav_destination d
  ),
  
  'routes', (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'routeClean', r.route_clean,
        'description', r.description,
        'isActive', r.is_active,
        'resolution', (
          SELECT JSON_OBJECT(
            'destinationKey', d.destination_key,
            'layout', rr.layout
          )
          FROM app_nav_route_resolution_active ra
          JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id = ra.resolution_rev_id
          JOIN app_nav_destination d ON d.destination_id = rr.destination_id
          WHERE ra.route_id = r.route_id
        )
      )
    )
    FROM app_nav_route r
  ),
  
  'stats', JSON_OBJECT(
    'totalActions', (SELECT COUNT(*) FROM app_nav_action),
    'totalDestinations', (SELECT COUNT(*) FROM app_nav_destination),
    'totalRoutes', (SELECT COUNT(*) FROM app_nav_route),
    'totalBindings', (SELECT COUNT(*) FROM app_nav_binding_active),
    'totalResolutions', (SELECT COUNT(*) FROM app_nav_route_resolution_active)
  )
) AS navpack;
